import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import useEventListener from '@/plugins/useEventListener';
import SearchModal from '@/components/dashboard/search/SearchModal';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import tw from 'twin.macro';

export default () => {
    const [visible, setVisible] = useState(false);

    useEventListener('keydown', (e: KeyboardEvent) => {
        if (['input', 'textarea'].indexOf(((e.target as HTMLElement).tagName || 'input').toLowerCase()) < 0) {
            if (!visible && e.metaKey && e.key.toLowerCase() === '/') {
                setVisible(true);
            }
        }
    });

    return (
        <>
            {visible && <SearchModal appear visible={visible} onDismissed={() => setVisible(false)} />}
            <Tooltip placement={'bottom'} content={'Search'}>
                <button
                    onClick={() => setVisible(true)}
                    css={tw`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl text-white transition-all duration-300 bg-white/5 border border-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:scale-105`}
                >
                    <FontAwesomeIcon icon={faSearch} />
                </button>
            </Tooltip>
        </>
    );
};
