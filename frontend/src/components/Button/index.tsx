import clsx from "clsx"

interface IButton {
  label: string
  className?: string
  onClick: () => void
  disabled?: boolean
  [key: string]: any
}

const Button = ({ label, className, onClick, disabled, ...rest }: IButton) => {
  return (
    <button 
      className={clsx(
        "font-bold py-2 px-4 rounded transition-colors",
        disabled 
          ? "bg-gray-400 text-gray-600 cursor-not-allowed" 
          : "bg-purple-700 hover:bg-purple-900 text-white",
        className
      )} 
      onClick={disabled ? undefined : onClick} 
      disabled={disabled}
      {...rest}
    >
      {label}
    </button>
  )
}


export default Button