import { FragmentSchema } from '@/lib/schema'
import { ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'

const sandboxTimeout = 10 * 60 * 1000 // 10 minute in ms

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) throw new Error("E2B_API_KEY is not set in the environment");
    const {
      fragment,
      userID,
      teamID,
      accessToken,
    }: {
      fragment: FragmentSchema
      userID: string | undefined
      teamID: string | undefined
      accessToken: string | undefined
    } = await req.json()
    console.log('fragment', fragment)
    console.log('userID', userID)
    console.log('apiKey', apiKey)
    console.log('teamID', teamID)


    // Create an interpreter or a sandbox
    const sbx = await Sandbox.create(fragment.template, {
      apiKey,
      metadata: {
        template: fragment.template,
        userID: userID ?? '',
        teamID: teamID ?? '',
      },
      timeoutMs: sandboxTimeout,
      ...(teamID && accessToken
        ? {
            headers: {
              'X-Supabase-Team': teamID,
              'X-Supabase-Token': accessToken,
            },
          }
        : {}),
        logger: console,
    })

    // Install packages
  /*  if (fragment.has_additional_dependencies) {
      await sbx.commands.run(fragment.install_dependencies_command)
      console.log(
        `Installed dependencies: ${fragment.additional_dependencies.join(', ')} in sandbox ${sbx.sandboxId}`,
      )
    }*/

    // Copy code to fs
    if (fragment.code && Array.isArray(fragment.code)) {
      for (const file of fragment.code) {
        await sbx.files.write('my-app/' + file.file_path, file.file_content)
      //  const log = await sbx.files.list('my-app/' + file.file_path)
        console.log(`Copied file to ${file.file_path} in ${sbx.sandboxId}`)
      }
    } else {
      await sbx.files.write('my-app/' + fragment.file_path, fragment.code)
      //const log = await sbx.files.list('my-app/' + fragment.file_path)
      console.log(`Copied file to ${fragment.file_path} in ${sbx.sandboxId}`)
    }

    // Execute code or return a URL to the running sandbox
    if (fragment.template === 'code-interpreter-v1') {
      const { logs, error, results } = await sbx.runCode(fragment.code || '')

      return new Response(
        JSON.stringify({
          sbxId: sbx?.sandboxId,
          template: fragment.template,
          stdout: logs.stdout,
          stderr: logs.stderr,
          runtimeError: error,
          cellResults: results,
        } as ExecutionResultInterpreter),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        sbxId: sbx?.sandboxId,
        template: fragment.template,
        url: `https://${sbx?.getHost(fragment.port || 80)}`,
      } as ExecutionResultWeb),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error("Error in /api/sandbox:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
