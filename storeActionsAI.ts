
import { GoogleGenAI } from '@google/genai';
import { MindMapState } from './types';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

export const createAIActions = (set: SetState, get: GetState) => ({
    generateNodeSynthesis: async (nodeId: number) => {
        const { nodes, actions } = get();
        const node = nodes.find(n => n.id === nodeId);

        if (!node || !node.description?.trim()) {
            actions._addLog('No hay descripción para generar una síntesis.', 'warning');
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const descriptionLength = node.description.trim().length;
            let summaryLines = 4;
            if (descriptionLength < 200) {
                summaryLines = 1;
            } else if (descriptionLength < 800) {
                summaryLines = 2;
            }

            const prompt = `Genera un resumen conciso y directo del siguiente texto en un máximo de ${summaryLines} líneas cortas. El resumen debe ser puramente descriptivo para un nodo de diagrama, sin frases introductorias como 'Aquí tienes...'. Responde únicamente con el resumen. Texto a resumir:\n\n---\n\n${node.description}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const synthesis = response.text.trim();

            const newNodes = get().nodes.map(n => 
                n.id === nodeId ? { ...n, synthesis } : n
            );

            get().actions._updateState({ nodes: newNodes });
            actions._addLog(`Síntesis generada para el nodo '${node.title}'.`, 'success');

        } catch (error) {
            console.error("Error generating synthesis:", error);
            actions._addLog('Error al generar la síntesis con la IA.', 'error');
        }
    },
});
