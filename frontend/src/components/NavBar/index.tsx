const NavBar = () => {
  return (
    <div className="px-6 py-4 flex justify-between items-center border-b">
      <div className="flex gap-2 items-center">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
          <span className="text-white font-bold text-xs">AI</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">LedgerLens</h1>
          <p className="text-xs text-gray-500">AI-assisted statement processing</p>
        </div>
      </div>
      <div>
        <div className="h-12 w-12 rounded-full bg-purple-100 border border-purple-300 flex justify-center items-center text-purple-700 text-lg">
          U
        </div>
      </div>
    </div>
  )
}

export default NavBar