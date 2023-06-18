<style>
    .answer {
        background-color:var(--slide-answer-panel);
        flex:1;
        min-height: 100%;
        height:100%;
        position:relative;
        display:flex;
        justify-content: center;
        align-items: center;
        border-radius: 10px;
    }
    .correct {
        background-color: rgb(77, 139, 87);
    }
    .answer.correct .answer-text-input:hover {
        outline-color: rgb(163, 230, 174);
        outline-style: solid;
        outline-width: 1px;
    }
    .answer.correct .answer-text-input:focus {
        outline-color: whitesmoke;
        outline-style: solid;
        outline-width: 1px;
    }
    .correct-answer-select {
        accent-color: rgb(52, 94, 59);
        width:2rem;
        height:2rem;
        position:absolute;
        margin:8px;
        top:0;
        right:0;
        z-index: 1;
    }
    .answer-text-input {
        border-radius: 5px;
        color:var(--slide-answer-text);
        text-align: center;
        vertical-align: middle;
        width:80%;
        max-height: fit-content;
        overflow: hidden;
        font-size:1.5rem;
        word-wrap: break-word;
        background-color: transparent;
        padding: 2px;
    }
    .answer-text-input:hover {
        outline-color: var(--slide-darker-text);
        outline-style: solid;
        outline-width: 1px;
    }
    .answer-text-input:focus {
        outline-color: whitesmoke;
        outline-style: solid;
        outline-width: 1px;
    }
    .placeholder-text::before {
        content: "Answer text";
        color:var(--slide-answer-darker-text);
    }
    .placeholder-text:hover::before {
        cursor:text;
    }
    .placeholder-text:focus::before {
        content: "";
    }
</style>

<script lang="ts">
    export let text: string;
    export let isMultipleAnswer = false;
    export let index: number;
    export let correctAnswer: Array<number>;
    $: isChecked = correctAnswer.includes(index);
    $: answerEmpty = text.trim()==="";
</script>

<div class:correct={isChecked} class="answer">
    <div class="answer-text-input" bind:textContent={text} class:placeholder-text={answerEmpty} contenteditable="true"></div>
    <input class="correct-answer-select" type="checkbox" on:input={(e)=>{
        if (isMultipleAnswer && e.currentTarget.checked) {
            correctAnswer = [...correctAnswer, index];
        } else if (!isMultipleAnswer && e.currentTarget.checked) {
            correctAnswer = [index];
        } else {
            correctAnswer = correctAnswer.filter(i=>i!==index);
        }
    }} bind:checked={isChecked}/>
</div>
