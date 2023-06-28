export const hostTemplate = async (templateId: string) => {

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