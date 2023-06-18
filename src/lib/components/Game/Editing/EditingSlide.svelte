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
        background-color: var(--background-nav);
        border-radius: 10px;
    } 
    .container {
        flex:1;
    }
    .padding {
        padding: 0.5rem;
    }
    .answer-wrapper {
        flex:1;
        width:100%;
        height:100%;
        display:flex;
        flex-wrap: wrap;
    }
    .answer-wrapper .container {
        flex:1 0 40%
    }
    .question-wrapper {
        height:100%;
        border-radius: 10px;
        background-color: var(--slide-panel);
        display:flex;
        justify-content: center;
        align-items: center;
    }
    .question-text {
        border-radius: 5px;
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
    .question-text:hover {
        outline-color: var(--slide-darker-text);
        outline-style: solid;
        outline-width: 1px;
    }
    .question-text:focus {
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
    <div class="container padding">
        <div class="question-wrapper">
            <div class="question-text" bind:innerText={slide.text} contenteditable="true" class:placeholder-text={questionEmpty}></div>
        </div>
    </div>
    <div class="container">
        <div class="answer-wrapper">
            {#each slide.answers as answer}
            <div class="container padding">
                <EditingAnswer
                    index={answer.index}
                    bind:text={answer.text}
                    isMultipleAnswer={slide.isMultipleAnswer}
                    bind:correctAnswer={slide.correctAnswer}
                />
            </div>
            {/each}
        </div>
    </div>
    
</section>


