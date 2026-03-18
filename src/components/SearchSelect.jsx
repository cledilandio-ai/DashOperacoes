import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const SearchSelect = ({ options, value, onChange, placeholder = "Selecione...", required = false, emptyMessage = "Nenhum resultado." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    // Fecha o dropdown se clicar fora
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtro super inteligente (nome, descrição ou tag - qualquer pedaço da palavra)
    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const lowSearch = search.toLowerCase();
        
        return options.filter(opt => {
            const lowLabel = (opt.label || '').toLowerCase();
            const lowDesc = (opt.descricao || '').toLowerCase();
            const lowTag = (opt.tag || '').toLowerCase();
            
            return lowLabel.includes(lowSearch) || 
                   lowDesc.includes(lowSearch) || 
                   lowTag.includes(lowSearch);
        });
    }, [search, options]);

    // Busca o ítem selecionado atualmente
    const selectedOption = options.find(opt => opt.value == value);

    return (
        <div ref={wrapperRef} className="relative w-full">
            {/* Input escondido para garantir que o 'required' do navegador funcione no form */}
            <input 
                type="text" 
                className="sr-only" 
                value={value || ''} 
                onChange={() => {}} 
                tabIndex={-1} 
                required={required} 
            />

            <div 
                className={`input-field flex items-center justify-between cursor-pointer select-none transition-all
                    ${isOpen ? 'ring-2 ring-amber-500 border-amber-500' : ''}`}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setSearch(''); // zera a busca ao abrir
                }}
            >
                <div className="truncate flex-1">
                    {selectedOption ? (
                        <div className="font-bold text-slate-800">
                            {selectedOption.label} 
                            {selectedOption.tag && <span className="text-xs text-slate-400 font-mono ml-2 border border-slate-200 px-1 rounded bg-slate-50">{selectedOption.tag}</span>}
                        </div>
                    ) : (
                        <span className="text-slate-400 italic">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[320px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/80 backdrop-blur shrink-0">
                        <Search className="w-5 h-5 text-amber-500" />
                        <input
                            type="text"
                            className="w-full text-sm outline-none bg-transparent font-medium text-slate-700 placeholder:text-slate-400"
                            placeholder="Buscar por nome, tag ou partes da palavra..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto p-1.5 flex-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map((opt, i) => (
                            <div
                                key={opt.value || i}
                                className={`px-4 py-2.5 my-0.5 text-sm cursor-pointer rounded-lg transition-colors
                                    ${opt.value == value 
                                        ? 'bg-amber-100/50 text-amber-900 border border-amber-200' 
                                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="font-bold">{opt.label}</div>
                                {(opt.tag || opt.descricao) && (
                                    <div className="text-[11px] text-slate-400 mt-1 leading-tight line-clamp-1">
                                        {[opt.tag, opt.descricao].filter(Boolean).join(' • ')}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="px-4 py-8 text-sm text-center text-slate-400 flex flex-col items-center gap-2">
                                <Search className="w-6 h-6 opacity-30" />
                                {emptyMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchSelect;
