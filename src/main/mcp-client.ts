import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import type { GenerationJob } from '../renderer/types/generation'
import { BrowserWindow } from 'electron'

let mcpClient: Client | null = null
let transport: StdioClientTransport | null = null

interface McpConfig {
  mcpServers: {
    [key: string]: {
      command: string
      args: string[]
      env?: Record<string, string>
    }
  }
}

async function getMcpConfig(): Promise<McpConfig> {
  const configPath = path.join(os.homedir(), '.claude', '.mcp.json')
  const raw = await fs.readFile(configPath, 'utf-8')
  return JSON.parse(raw)
}

async function ensureClient(): Promise<Client> {
  if (mcpClient) return mcpClient

  const config = await getMcpConfig()
  const serverConfig = config.mcpServers['openrouter-image-gen']
  if (!serverConfig) {
    throw new Error('openrouter-image-gen not found in ~/.claude/.mcp.json')
  }

  transport = new StdioClientTransport({
    command: serverConfig.command,
    args: serverConfig.args,
    env: { ...process.env, ...serverConfig.env } as Record<string, string>
  })

  mcpClient = new Client({ name: 'asset-gen', version: '0.1.0' }, {})
  await mcpClient.connect(transport)

  return mcpClient
}

export async function generateWithMcp(
  assetId: string,
  prompt: string,
  modelId: string,
  filename: string,
  maskPath: string | null = null
): Promise<GenerationJob> {
  const job: GenerationJob = {
    id: `${assetId}-${Date.now()}`,
    assetId,
    model: { id: modelId as any, shortName: getShortName(modelId), displayName: '', priceHint: '' },
    mediaType: 'image',
    status: 'generating',
    startedAt: Date.now()
  }

  // Notify renderer of job start
  const win = BrowserWindow.getAllWindows()[0]
  win?.webContents.send('generation:update', job)

  try {
    const client = await ensureClient()

    // Build the prompt — either a plain string or multimodal array with mask image
    let mcpPrompt: string | Array<Record<string, unknown>> = prompt
    if (maskPath) {
      const maskData = await fs.readFile(maskPath)
      const b64 = maskData.toString('base64')
      const dataUrl = `data:image/png;base64,${b64}`
      mcpPrompt = [
        { type: 'image_url', image_url: { url: dataUrl } },
        { type: 'text', text: prompt }
      ]
    }

    const result = await client.callTool({
      name: 'generate_image',
      arguments: {
        prompt: mcpPrompt,
        model: modelId,
        save_to_file: true,
        filename
      }
    })

    job.status = 'completed'
    job.completedAt = Date.now()

    // Parse result to find the saved file path
    const content = result.content as Array<{ type: string; text?: string }>
    const textContent = content.find((c) => c.type === 'text')?.text || ''
    const pathMatch = textContent.match(/saved to[:\s]+(.+\.(png|jpg))/i)
    if (pathMatch) {
      job.resultPath = pathMatch[1]
    }
  } catch (err: any) {
    job.status = 'failed'
    job.error = err.message
    job.completedAt = Date.now()
  }

  win?.webContents.send('generation:update', job)
  return job
}

function getShortName(modelId: string): 'nb1' | 'nb2' | 'nbpro' {
  if (modelId.includes('3-pro')) return 'nbpro'
  if (modelId.includes('3.1-flash')) return 'nb2'
  return 'nb1'
}
