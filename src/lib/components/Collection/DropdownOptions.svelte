<script lang="ts">
    import type { StoredGameTemplate } from "$lib/models/gameTemplate";

    export let template: StoredGameTemplate;

    let show: boolean = false;

    const changeTemplatePublic = async () => {
        const newTemplate: StoredGameTemplate = {...template, public: !template.public };
        try {
            const res = await fetch(`/game-template/${template._id}`, {
                method: "POST",
                body: JSON.stringify(newTemplate),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const fromEndpoint = await res.json();
            if (fromEndpoint.status === 200) {
                template = newTemplate;
            } else {
                throw new Error(fromEndpoint.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const deleteTemplate = async () => {
    }
</script>

<div>
    <button type="button" class="dropdown-button" on:click={()=>{show=!show}}>
        <i class="mi mi-options-horizontal"><span class="u-sr-only">Go left slide</span></i>
    </button>
    <div class="dropdown-menu" class:shown={show}>
        <a class="dropdown-item" href="/edit/{template._id}">Edit</a>
        <button class="dropdown-item" on:click={changeTemplatePublic}>{template.public ? "Make private" : "Make public"}</button>
        <button class="dropdown-item" on:click={deleteTemplate}>Delete</button>
    </div>
</div>

<style>
    .dropdown-button {
        color: var(--slide-darker-text);
        background-color: transparent;
        border: none;
        
    }
    .dropdown-button:hover {
        cursor: pointer;
        color: var(--slide-text);
    }
    .dropdown-menu {
        display:none;
        position:absolute;
        z-index: 1;
        background-color: var(--slide-answer-panel);
    }
    .dropdown-item {
        display:block;
    }
    .shown {
        display:block;
    }
</style>
