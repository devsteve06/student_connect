function Input({
    label,
    error,
    type = 'text',
    className = '',
    id,
    ... props
}) {

    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
     
      {
        label &&  <label htmlFor={inputId} className='text-sm font-medium text-gray-700'>  {label} </label>

      }

      
        <input
        id={inputId}
        type={type}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow
          ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
          }`}
        {...props}
      />
      
      {error && (
        <span className="text-xs text-red-500 font-medium mt-0.5">
          {error}
        </span>
      )}
      
    </div>
  )
}

export default Input
