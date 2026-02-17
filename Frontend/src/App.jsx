import GestionApp from "./GestionApp"
import { ThemeProvider } from "./context/ThemeContext"

function App() {

  return (
    <>
      <ThemeProvider>
        <GestionApp />
      </ThemeProvider>
    </>
  )
}

export default App
