<script lang="ts">
    import type { Slide } from "$lib/models/gameTemplate";
    import type { SlideError } from "$lib/validation/templateValidation";
    import EditingAnswer from "./EditingAnswer.svelte";
    import { createEventDispatcher } from "svelte";

    let dispatch = createEventDispatcher();

    export let slide: Slide;

    export let slideError: SlideError | undefined = undefined;

    $: questionEmpty = slide.text?.trim()==="";
</script>

<section>
    <div class="container padding">
        <div class="question-wrapper">
            <div class="question-text" bind:innerText={slide.text} contenteditable="true" class:placeholder-text={questionEmpty} ></div>
        </div>
    </div>
    <div class="container">
        <div class="answer-wrapper">
            {#each slide.answers as answer}
            <div class="container padding">
                <EditingAnswer
                    index={answer.index}
                    bind:text={answer.text}
                    isMultipleAnswer={slide.is_multiple_answer}
                    bind:correctAnswer={slide.correct_answer}
                    on:removeAnswerError={()=>{
                        dispatch("removeAnswerError", {index: answer.index});
                    }}
                    on:removeCorrectAnswerError={()=>{
                        dispatch("removeCorrectAnswerError");
                    }}
                    answerError={slideError?.invalidAnswers.find(e=>e.index===answer.index)}
                    correctAnswerError={slideError?.correctAnswerOutOfBounds || slideError?.multipleCorrectOnSingleAnswer || slideError?.noCorrectAnswer}
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


