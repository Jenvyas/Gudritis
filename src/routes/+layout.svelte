<style>
    main {
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        display:flex;
    }
</style>

<main>
    <aside>
        <nav>
            <a href="/"><i class="mi mi-home"><span class="u-sr-only">Home</span></i></a>
            <a href="/search"><i class="mi mi-search"><span class="u-sr-only">Search</span></i></a>
            <a href="/create"><i class="mi mi-circle-add"><span class="u-sr-only">Create game template</span></i></a>
            <a href="/collection"><i class="mi mi-archive"><span class="u-sr-only">Collection</span></i></a>
        </nav>
    </aside>
    <slot/>
</main>
