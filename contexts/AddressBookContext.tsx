"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface AddressBookEntry {
    address: string;
    name: string;
    addedAt: number;
}

interface AddressBookContextType {
    entries: Record<string, string>; // address -> name mapping
    getName: (address: string) => string | null;
    saveName: (address: string, name: string) => void;
    removeEntry: (address: string) => void;
    allEntries: AddressBookEntry[];
}

const AddressBookContext = createContext<AddressBookContextType | undefined>(undefined);

const STORAGE_KEY = "batchpay_address_book";

export function AddressBookProvider({ children }: { children: React.ReactNode }) {
    const [entries, setEntries] = useState<Record<string, string>>({});
    const [initialized, setInitialized] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as any[];
                const mapping: Record<string, string> = {};
                parsed.forEach(entry => {
                    if (entry.address && entry.name) {
                        mapping[entry.address] = String(entry.name);
                    }
                });
                setEntries(mapping);
            } catch (err) {
                console.error("Failed to parse address book:", err);
            }
        }
        setInitialized(true);
    }, []);

    // Persist to localStorage when entries change
    useEffect(() => {
        if (!initialized) return;

        const entryList: AddressBookEntry[] = Object.entries(entries).map(([address, name]) => ({
            address,
            name,
            addedAt: Date.now(),
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify(entryList));
    }, [entries, initialized]);

    const getName = useCallback((address: string) => {
        return entries[address] || null;
    }, [entries]);

    const saveName = useCallback((address: string, name: string) => {
        setEntries(prev => ({
            ...prev,
            [address]: name
        }));
    }, []);

    const removeEntry = useCallback((address: string) => {
        setEntries(prev => {
            const next = { ...prev };
            delete next[address];
            return next;
        });
    }, []);

    const allEntries: AddressBookEntry[] = Object.entries(entries).map(([address, name]) => ({
        address,
        name,
        addedAt: 0,
    }));

    const value: AddressBookContextType = {
        entries,
        getName,
        saveName,
        removeEntry,
        allEntries,
    };

    return (
        <AddressBookContext.Provider value={value}>
            {children}
        </AddressBookContext.Provider>
    );
}

export function useAddressBook() {
    const context = useContext(AddressBookContext);
    if (context === undefined) {
        throw new Error("useAddressBook must be used within an AddressBookProvider");
    }
    return context;
}
