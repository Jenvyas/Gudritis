<script lang="ts">
    import type { Slide } from "$lib/models/gameTemplate";
    import EditingAnswer from "./EditingAnswer.svelte";

    export let slide: Slide;
    $: questionEmpty = slide.text?.trim()==="";
</script>

<style>
    section {
        width: 100%;
        height: 100%;
        display:flex;
        flex-direction: column;
    }
    .answer-wrapper {
        flex:1;
        width:100%;
        display:flex;
        flex-wrap: wrap;
    }
    .question-wrapper {
        flex:1;
        margin: 0.5rem;
        border-radius: 10px;
        background-color: var(--slide-panel);
        display:flex;
        justify-content: center;
        align-items: center;
    }
    .question-text {
        color:var(--slide-text);
        text-align: center;
        vertical-align: middle;
        font-size: 2rem;
        padding: 2px;
        overflow-wrap: break-word;
        height:fit-content;
        max-height: fit-content;
        width: 80%;
        word-wrap: break-word;
        overflow:hidden;
    }
    .question-text:focus {
        border-radius: 5px;
        outline-color: whitesmoke;
        outline-style: solid;
        outline-width: 1px;
    }
    .placeholder-text::before {
        content: "Question text";
        color:var(--slide-darker-text);
    }
    .placeholder-text:hover::before {
        cursor:text;
    }
    .placeholder-text:focus::before {
        content: "";
    }
</style>

<section>
    <div class="question-wrapper">
        <div class="question-text" bind:innerText={slide.text} contenteditable="true" class:placeholder-text={questionEmpty}></div>
    </div>
    <div class="answer-wrapper">
        {#each slide.answers as answer}
            <EditingAnswer
                index={answer.index}
                bind:text={answer.text}
                isMultipleAnswer={slide.isMultipleAnswer}
                bind:correctAnswer={slide.correctAnswer}
            />
        {/each}
    </div>
</section>


