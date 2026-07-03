import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[countdown-module] presenter error", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return <div data-countdown-stage style={{ width: "100%", height: "100%", background: "#000" }} />
    }
    return this.props.children
  }
}
