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
        border-radius: 5px;
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
    .answer-text-input {
        border-radius: 3px;
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
</style>

<script lang="ts">
    export let text: string;
    export let index: number;
    export let correct_answer: Array<number>;
    $: isChecked = correct_answer.includes(index);
</script>

<div class:correct={isChecked} class="answer">
    <div class="answer-text-input">{text}</div>
</div>
