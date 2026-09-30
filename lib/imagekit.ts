import { createHmac } from "node:crypto"
import * as Sentry from "@sentry/nextjs"
import { getUploadAuthParams } from "@imagekit/next/server"

// Server-only: everything here needs the private key.
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY!
const urlEndpoint = (process.env.IMAGEKIT_URL_ENDPOINT ?? "").replace(/\/$/, "")

// One-time params for a browser → ImageKit upload. The public key rides along so the client needs no env of its own.
export function uploadAuth() {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY!
  return { ...getUploadAuthParams({ privateKey, publicKey }), publicKey, folder: process.env.IMAGEKIT_FOLDER ?? "dev" }
}

export const publicUrl = (path: string) => urlEndpoint + path

// Private files are only reachable through a signed URL: HMAC-SHA1 of everything after "<endpoint>/" + the expiry.
// Takes a file path ("/dev/a.mp4") or a full URL on our endpoint, including sub-paths and ?tr= transformations.
export function signedUrl(pathOrUrl: string, expiresInS: number) {
  const url = pathOrUrl.startsWith("/") ? urlEndpoint + pathOrUrl : pathOrUrl
  const expire = Math.floor(Date.now() / 1000) + expiresInS
  const signature = createHmac("sha1", privateKey)
    .update(url.slice(urlEndpoint.length + 1) + expire)
    .digest("hex")
  return `${url}${url.includes("?") ? "&" : "?"}ik-t=${expire}&ik-s=${signature}`
}

// True when `url` is the file at `path` on our endpoint, or something ImageKit derives from it: a sub-path
// (poster, seek thumbnails) or a ?tr= rendition. URL parsing normalises "..", so nothing can climb out of `path`.
export function isFileOrDerived(url: string, path: string) {
  const target = new URL(url)
  const file = target.origin + target.pathname
  const own = publicUrl(path)
  return file === own || file.startsWith(own + "/")
}

// Best effort: an orphaned file only costs storage, so failures are logged, never thrown.
export async function deleteFiles(fileIds: (string | null)[]) {
  const auth = "Basic " + Buffer.from(privateKey + ":").toString("base64")
  for (const id of fileIds) {
    if (!id) continue
    const res = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: auth } }).catch(
      (e: Error) => ({ ok: false, status: e.message })
    )
    // Each one is an orphaned file you're paying to store; file_id finds it in the ImageKit dashboard.
    if (!res.ok) Sentry.logger.warn("ImageKit delete failed", { file_id: id, status: String(res.status) })
  }
}
