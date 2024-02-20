import { goto } from "$app/navigation";

export const hostTemplate = async (templateId: string) => {
    try {
        goto(`/host/${templateId}`);
    } catch (error) {
        console.error(error);
    }
}

export const deleteTemplate = async (templateId: string) => {
    try {
        const postRes = await fetch(`/game-template/${templateId}`, {
            method: "DELETE",
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
    }
}