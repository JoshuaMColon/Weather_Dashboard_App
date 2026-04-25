// ErrorMessage.jsx
// Shows a red error message when something goes wrong

function ErrorMessage({ message }) {
    if (!message) return null

    return (
        <div className="bg-red-50 border border-red-200 text-red-700
        rounded-lg px-6 py-4 mt-4 max-w-md w-full">
            {message}
        </div>
    )
}

export default ErrorMessage