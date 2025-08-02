    export async function handleRefresh() {
        const res = await fetch('/api/actions/refresh', { method: 'POST' });
        console.log(await res.json());
    }