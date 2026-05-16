import React from 'react';

export const Toggle = ({ enabled, onChange, label, description }: { enabled: boolean, onChange: (val: boolean) => void, label: string, description?: string }) => {
    const id = React.useId();
    const labelId = `${id}-label`;
    const descId = `${id}-desc`;

    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex flex-col pr-4">
                <span id={labelId} className="text-[15px] font-medium text-white light:text-black">{label}</span>
                {description && <span id={descId} className="text-[13px] text-[#888] light:text-gray-500 mt-0.5">{description}</span>}
            </div>
            <button
                role="switch"
                aria-checked={enabled}
                aria-labelledby={labelId}
                aria-describedby={description ? descId : undefined}
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] ${enabled ? 'bg-[#00d2ff] light:bg-blue-500' : 'bg-white/20 light:bg-black/10'}`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </button>
        </div>
    );
};

export const Select = ({ value, onChange, options, label, description }: { value: string, onChange: (val: string) => void, options: {id: string, label: string}[], label: string, description?: string }) => {
    const id = React.useId();
    const selectId = `${id}-select`;
    const descId = `${id}-desc`;

    return (
        <div className="flex flex-col py-3">
            <div className="flex items-center justify-between mb-2">
                 <label htmlFor={selectId} className="text-[15px] font-medium text-white light:text-black">{label}</label>
                 <select
                    id={selectId}
                    aria-describedby={description ? descId : undefined}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-white/5 light:bg-black/5 text-white light:text-black text-[14px] rounded-lg px-3 py-1.5 border border-white/10 light:border-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] focus:border-[#00d2ff] light:focus:border-blue-500 cursor-pointer"
                 >
                    {options.map(opt => <option key={opt.id} value={opt.id} className="bg-[#121212] light:bg-white">{opt.label}</option>)}
                 </select>
            </div>
            {description && <span id={descId} className="text-[13px] text-[#888] light:text-gray-500">{description}</span>}
        </div>
    );
};

export const ActionButton = ({ onClick, label, description, buttonText, destructive = false }: { onClick: () => void, label: string, description?: string, buttonText: string, destructive?: boolean }) => {
    const id = React.useId();
    const labelId = `${id}-label`;
    const descId = `${id}-desc`;

    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex flex-col pr-4">
                <span id={labelId} className="text-[15px] font-medium text-white light:text-black">{label}</span>
                {description && <span id={descId} className="text-[13px] text-[#888] light:text-gray-500 mt-0.5">{description}</span>}
            </div>
            <button
                aria-labelledby={labelId}
                aria-describedby={description ? descId : undefined}
                onClick={onClick}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] ${destructive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/10 light:bg-black/10 text-white light:text-black hover:bg-white/20 light:hover:bg-black/20'}`}
            >
                {buttonText}
            </button>
        </div>
    );
};
