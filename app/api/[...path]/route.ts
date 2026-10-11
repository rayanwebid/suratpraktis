import { env } from 'cloudflare:workers';
import { handle, type Env } from '../../../server/backend';
import { getChatGPTUser } from '../../chatgpt-auth';
export const dynamic='force-dynamic';
async function dispatch(request:Request){const owner=(env as unknown as Env).SITES_HOSTED_AUTH==='1'&&request.method==='GET'&&new URL(request.url).pathname==='/api/auth/owner'?await getChatGPTUser():null;return handle(request,env as unknown as Env,owner);}
export const GET=dispatch;
export const POST=dispatch;
export const PATCH=dispatch;
export const DELETE=dispatch;
