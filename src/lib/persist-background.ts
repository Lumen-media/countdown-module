export type PickedBackground = {
  type: string
  src?: string
  name?: string
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Unexpected FileReader result"))
    }
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read background blob"))
    reader.readAsDataURL(blob)
  })
}

export async function persistentBackgroundSrc(bg: PickedBackground): Promise<string> {
  const src = bg.src ?? ""
  if (bg.type !== "image" || !src.startsWith("blob:")) return src

  const response = await fetch(src)
  const blob = await response.blob()
  return blobToDataUrl(blob)
}
