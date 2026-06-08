export interface Command {
  name: string
  type: string
  payload: any
}

export interface MusicCommand {
    audio_format: string
    compat: string
    extra_flags: string[]
    extractor: string
    format: string
    headers: string
    use_cookies: boolean
    use_proxy: boolean
}

export interface VideoCommand {
    extra_flags: string[]
    headers: string
    extractor: string
    compat: string
    postprocessor: string
    format_sort: string
    use_proxy: boolean
    use_cookies: boolean
}

export interface SaveJsonCommand {
  extra_flags: string[]
  headers: string
  extractor: string
  use_proxy: boolean
  use_cookies: boolean
}