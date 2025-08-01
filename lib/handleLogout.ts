export const handleLogout = async () => {
        await fetch(`/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        }
    )
    window.location.href = '/login';
    }