import React from 'react'
import { Button } from './ui/button'
import { handleRefresh } from '@/lib/handleRefresh';

const RefreshButton = () => {

    return (
        <Button onClick={handleRefresh}>Refresh</Button>
    );
}
export default RefreshButton