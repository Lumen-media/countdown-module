import { invoke } from "@tauri-apps/api/core"
import { useEffect, useState } from "react"

const FALLBACK_FONTS = [
  "Arial",
  "Arial Black",
  "Calibri",
  "Cambria",
  "Century Gothic",
  "Comic Sans MS",
  "Consolas",
  "Courier New",
  "Georgia",
  "Impact",
  "Inter",
  "Montserrat",
  "Open Sans",
  "Poppins",
  "Raleway",
  "Roboto",
  "Segoe UI",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
]

export function useLocalFonts() {
  const [fonts, setFonts] = useState<string[]>(FALLBACK_FONTS)

  useEffect(() => {
    invoke<string[]>("get_system_fonts")
      .then((families) => {
        if (families.length > 0) setFonts(families)
      })
      .catch((err) => console.warn("[countdown-module] get system fonts", err))
  }, [])

  return { fonts }
}
