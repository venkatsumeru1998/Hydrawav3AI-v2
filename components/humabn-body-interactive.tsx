"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import React, { useState, useEffect, useRef } from "react";
import { HumanBodyParts } from "./human-body-parts";

interface HumanBodyViewerInteractiveProps {
    onPartSelect?: (partName: string | null) => void;
    selectedPart?: string | null;
    allSelectedParts?: string[];
    focusRegions?: string[];
    clickable?: boolean;
}

export default function HumanBodyViewerInteractive({
    onPartSelect,
    selectedPart: externalSelectedPart,
    allSelectedParts = [],
    focusRegions = [],
    clickable = true,
}: HumanBodyViewerInteractiveProps) {
    const [internalSelectedPart, setInternalSelectedPart] = useState<string | null>(null);
    const [viewAllMode, setViewAllMode] = useState<boolean>(true);
    const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Track if models have been loaded at least once - use ref to persist across re-renders
    const hasLoadedOnceRef = useRef<boolean>(false);
    const initialLoadKeyRef = useRef<string>(`${allSelectedParts.join('-')}-${focusRegions.join('-')}`);

    // Only reset loading state when the actual body parts list changes (not just selection)
    useEffect(() => {
        const currentKey = `${allSelectedParts.join('-')}-${focusRegions.join('-')}`;

        // Only reset if the body parts actually changed (not just selection)
        if (currentKey !== initialLoadKeyRef.current) {
            initialLoadKeyRef.current = currentKey;
            // Only reset if we haven't loaded before, or if body parts actually changed
            if (!hasLoadedOnceRef.current) {
                setIsModelLoaded(false);
                setLoadError(null);
            }
        }
    }, [allSelectedParts, focusRegions]);

    // Fallback: hide loader after max 6 seconds to prevent stuck loading state (only on initial load)
    useEffect(() => {
        if (hasLoadedOnceRef.current) return; // Don't set timeout if already loaded

        const fallbackTimer = setTimeout(() => {
            if (!isModelLoaded && !hasLoadedOnceRef.current) {
                console.warn('Model loading timeout - showing model anyway');
                setIsModelLoaded(true);
                hasLoadedOnceRef.current = true;
            }
        }, 6000);

        return () => clearTimeout(fallbackTimer);
    }, [isModelLoaded]);

    // Handle model loaded callback with error handling
    const handleModelLoaded = () => {
        try {
            setIsModelLoaded(true);
            setLoadError(null);
            hasLoadedOnceRef.current = true; // Mark as loaded at least once
        } catch (error) {
            console.error('Error in handleModelLoaded:', error);
            setLoadError('Failed to load 3D model');
        }
    };

    const selectedPart = externalSelectedPart !== undefined ? externalSelectedPart : internalSelectedPart;

    // Determine which parts to show based on view mode
    const partsToShow = viewAllMode ? allSelectedParts : (selectedPart ? [selectedPart] : []);

    const handlePartSelect = (partName: string) => {
        // If clicking the same part, deselect it; otherwise select the new part
        const newSelection = selectedPart === partName ? null : partName;

        console.log(newSelection)

        if (externalSelectedPart === undefined) {
            setInternalSelectedPart(newSelection);
        }
        onPartSelect?.(newSelection ?? null);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative bg-white">
            <div className="w-full h-full max-w-full relative min-h-[400px]">
                {/* Loading State - Only show on initial load, not on selection changes */}
                {!isModelLoaded && !loadError && !hasLoadedOnceRef.current && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-600 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Loading 3D Model...
                            </p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {loadError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                        <div className="flex flex-col items-center gap-4 p-4">
                            <div className="text-red-500 text-4xl">⚠️</div>
                            <p className="text-sm text-gray-600 font-medium text-center" style={{ fontFamily: 'var(--font-poppins)' }}>
                                {loadError}
                            </p>
                            <button
                                onClick={() => {
                                    setLoadError(null);
                                    setIsModelLoaded(false);
                                    hasLoadedOnceRef.current = false;
                                    // Force re-render by updating a state
                                    setViewAllMode(!viewAllMode);
                                }}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                                style={{ fontFamily: 'var(--font-poppins)' }}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* View All Toggle Button */}
                {/* {allSelectedParts.length > 1 && (
                    <button
                        onClick={() => setViewAllMode(!viewAllMode)}
                        className="absolute top-4 right-4 z-10 bg-white border border-gray-300 rounded-lg p-2 shadow-md hover:bg-gray-50 transition-colors"
                        title={viewAllMode ? "View active area only" : "View all selected areas"}
                    >
                        {viewAllMode ? (
                            <EyeOff className="h-5 w-5 text-gray-700" />
                        ) : (
                            <Eye className="h-5 w-5 text-gray-700" />
                        )}
                    </button>
                )} */}

                <Canvas
                    resize={{ scroll: false, debounce: 100 }}
                    className="w-full h-full"
                    camera={{
                        position: [0, 0, 35.5],
                        fov: 38,
                        near: 0.1,
                        far: 100
                    }}
                    style={{
                        background: 'transparent',
                        opacity: hasLoadedOnceRef.current ? 1 : (isModelLoaded ? 1 : 0),
                        transition: hasLoadedOnceRef.current ? 'none' : 'opacity 0.3s ease-in'
                    }}
                >
                    {/* Soft medical lighting */}
                    <ambientLight intensity={0.9} />
                    <directionalLight position={[3, 6, 4]} intensity={0.8} />
                    <directionalLight position={[-3, 4, -2]} intensity={0.4} />

                    <HumanBodyParts
                        selectedPart={selectedPart}
                        selectedParts={partsToShow}
                        onPartSelect={handlePartSelect}
                        focusRegions={focusRegions}
                        clickable={clickable}
                        onModelLoaded={handleModelLoaded}
                    />


                    {/* Only allow horizontal (azimuthal) rotation */}
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        enableRotate={true}
                        minPolarAngle={Math.PI / 2}
                        maxPolarAngle={Math.PI / 2}
                    />
                </Canvas>

                {/* Selected part label overlay */}
                {/* {viewAllMode ? (
                    partsToShow.length > 0 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium max-w-[90%]">
                            <div className="text-center">
                                <div className="font-semibold mb-1">All Selected Areas ({partsToShow.length}):</div>
                                <div className="flex flex-wrap gap-1 justify-center">
                                    {partsToShow.map((part, idx) => (
                                        <span key={idx} className="bg-white/20 px-2 py-0.5 rounded text-xs">
                                            {part}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    selectedPart && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
                            Selected: {selectedPart}
                        </div>
                    )
                )} */}
            </div>
        </div>
    );
}

