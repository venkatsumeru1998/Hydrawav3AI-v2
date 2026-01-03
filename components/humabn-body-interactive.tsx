"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useState } from "react";
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
                {/* Loading State */}
                {!isModelLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-600 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                                Loading 3D Model...
                            </p>
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
                    style={{ background: 'transparent', opacity: isModelLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in' }}
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
                        onModelLoaded={() => setIsModelLoaded(true)}
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

