import React, { useEffect } from 'react';

const Unavailable: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(''), [setTitle]);

    return <div>Unavailable</div>;
};

export default Unavailable;
