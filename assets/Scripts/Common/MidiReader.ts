import { _decorator, resources, Asset } from 'cc';

// Declare the Tone global variable for TypeScript
declare global {
    interface Window {
        Tone: any;
        MidiParser: any;
        Midi: any;
    }
    var Tone: any;
    var Midi: any;
    var MidiParser: any;
}

export function loadMidi(resourcesPath: string, trackIndex: number = 1): Promise<any> {
    return new Promise((resolve, reject) => {
        resources.load(resourcesPath, (err, asset: any) => {
            if (err) {
                console.error("Error loading asset:", err);
                reject(err);
                return;
            }

            if (!(asset instanceof Asset)) {
                const error = new Error("Invalid asset type loaded");
                console.error(error.message, asset);
                reject(error);
                return;
            }

            // Get the URL of the Asset
            const url = asset.nativeUrl;

            // Load the binary data using XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer'; // Important!

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const arrayBuffer = xhr.response;
                    const byteArray = new Uint8Array(arrayBuffer);

                    try {
                        const midi = new Midi(byteArray.buffer);
                        console.log("MIDI file loaded successfully:", midi);

                        // Extract the specific track if requested and it exists
                        if (trackIndex >= 0 && midi.tracks && midi.tracks.length > trackIndex) {
                            resolve(midi.tracks[trackIndex]);
                        } else {
                            resolve(midi);
                        }
                    } catch (e) {
                        console.error("Error parsing MIDI data:", e);
                        reject(e);
                    }
                } else {
                    const error = new Error(`Error loading binary data: ${xhr.statusText}`);
                    console.error(error.message);
                    reject(error);
                }
            };

            xhr.onerror = (e) => {
                reject(new Error("Network error during MIDI file loading"));
            };

            xhr.send();
        });
    });
}