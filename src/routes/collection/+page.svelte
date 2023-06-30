<script lang="ts">
    import DropdownCollection from "$lib/components/Collection/DropdownCollection.svelte";
    import PreviewModal from "$lib/components/PreviewModal.svelte";
    import type { GameTemplate } from "$lib/models/gameTemplate";
    import type { PageData } from "./$types";

    export let data: PageData;

    let templates = data.templates;

    let previewTemplate: GameTemplate = {name: "",
        tags: [],
        slides: [
            {
                duration: 10,
                text: "",
                isMultipleAnswer: false,
                answers: [
                    {
                        index: 0,
                        text: "",
                    },
                    {
                        index: 1,
                        text: "",
                    },
                ],
                correctAnswer: [0],
            },
        ],
        author: "bob",
        author_id: "bob",
    };

    let previewShown = false;

    const showPreview = (template: GameTemplate) => {
        previewShown = true;
        previewTemplate = template;
    }
</script>

<div class="container">
    <article>
        <section>
            {#if templates && templates.length!==0}
                <div>
                    <div role="row" aria-rowindex={1} class="template-header-row">
                        <div role="columnheader" aria-colindex={1} class="template-number">#</div>
                        <div role="columnheader" aria-colindex={2} class="template-name">Name</div>
                        <div role="columnheader" aria-colindex={3} class="template-author">Author</div>
                        <div role="columnheader" aria-colindex={4} class="template-slide-length">Slides</div>
                        <div role="columnheader" aria-colindex={5} class="template-created-date">Created</div>
                    </div>
                </div>
                <hr>
                <div class="template-list">
                    {#each templates as template, i (template._id)}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <div class="template-row" class:flagged={template.flagged} aria-rowindex={i+2}>
                            <div aria-colindex={1} class="template-number">{i+1}</div>
                            <div aria-colindex={2} class="template-name" on:click={()=>{showPreview(template)}}>{template.name}</div>
                            <div aria-colindex={3} class="template-slide-length">{template.slides.length}</div>
                            <div aria-colindex={4} class="template-author">{template.author}</div>
                            <div aria-colindex={5} class="template-created-date">{`${template.created.getDate()}/${template.created.getMonth()}/${template.created.getFullYear()}`}</div>
                            <div aria-colindex={6} class="template-options"><DropdownCollection bind:template on:templateDeleted={()=>{templates = templates?.filter(t=>t._id!==template._id)}}/></div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div>
                    No Templates could be found
                </div>
            {/if}
        </section>
    </article>
</div>

<PreviewModal bind:showModal={previewShown} template={previewTemplate}/>


<style>
    hr {
        color: var(--slide-darker-text);
    }
    .container {
        width: 100%;
        padding: 1%;
    }
    article {
        color: var(--slide-text);
        width: 100%;
        height: 100%;
        display:flex;
        flex-direction: column;
        background-color: var(--background-nav);
        padding:10px;
        border-radius: 10px;
    } 
    section {
        width: 100%;
    }
    .template-list {
        width: 100%;
    }
    .template-row {
        display:grid;
        grid-template-columns: repeat(10, 1fr);
        grid-template-rows: 1;
        padding-top: 10px;
        gap:10px;
    }
    .template-row:hover {
        background-color: var(--slide-answer-panel);
    }
    .flagged {
        background-color: var(--error-darker);
    }
    .flagged:hover {
        background-color: var(--error);
    }
    .template-header-row {
        display:grid;
        grid-template-columns: repeat(10, 1fr);
        grid-template-rows: 1;
        gap:10px;
    }
    .template-number {
        grid-column: 1/2;
        grid-row: 1;
    }
    .template-name {
        grid-column: 2/5;
        grid-row: 1;
        overflow: scroll;
    }
    .template-author {
        grid-column: 5/7;
        grid-row: 1;
    }
    .template-name:hover {
        cursor:pointer;
    }
    .template-slide-length {
        grid-column: 7/8;
        grid-row: 1;
    }
    .template-created-date {
        grid-column: 8/10;
        grid-row: 1;
        text-align: right;
    }
</style>
