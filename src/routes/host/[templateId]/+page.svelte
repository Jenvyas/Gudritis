<script lang="ts">
    import { loginSession } from "$lib/stores";
    import { error } from "@sveltejs/kit";
    import { get } from "svelte/store";

    let user = get(loginSession);

    if (!user) {
        throw error(404, "User not found");
    }
</script>