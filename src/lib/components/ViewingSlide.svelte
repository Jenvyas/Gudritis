<script lang="ts">
    import type { Slide } from "$lib/models/gameTemplate";
    import Answer from "./Answer.svelte";

    export let slide: Slide;
</script>

<section>
    <div class="container padding">
        <div class="question-wrapper">
            <div class="question-text">{slide.text}</div>
        </div>
    </div>
    <div class="container">
        <div class="answer-wrapper">
            {#each slide.answers as answer}
            <div class="container padding">
                <Answer
                    index={answer.index}
                    bind:text={answer.text}
                    bind:correctAnswer={slide.correctAnswer}
                />
            </div>
            {/each}
        </div>
    </div>
    
</section>

<style>
    section {
        width: 100%;
        height: 100%;
        display:flex;
        flex-direction: column;
        background-color: var(--background-nav);
        border-radius: 5px;
    } 
    .container {
        flex:1;
    }
    .padding {
        padding: 0.5%;
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
        border-radius: 5px;
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
</style>


