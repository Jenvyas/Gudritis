import type { ActiveGameSession, Player } from "$lib/models/gameSession";
import type { StoredGameTemplate } from "$lib/models/gameTemplate";
import { Server } from "socket.io";
import type { ViteDevServer } from "vite";


/** @type {import('vite').Plugin} */
export const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		let activeGameSessions: Array<ActiveGameSession> = [];

		const io = new Server(server.httpServer as any)

		io.on('connection', (socket) => {
			let activeGame: ActiveGameSession | undefined;
			socket.on("new-game",({hostId, gameId, gameTemplate, code}: {hostId:string, gameId:string, gameTemplate:StoredGameTemplate, code: number})=>{
				io.to(socket.id).emit("new-game-ready");
				activeGameSessions.push({
					_id: gameId,
					started: false,
					finished: false,
					code,
					active: true,
					host: hostId,
					players: [],
					template: gameTemplate,
					player_answers: [],
					current_questions: new Map<string, number>()
				})
			})

			socket.on("join-game",({player, gameId}: {player: Player, gameId: string})=>{
				let activeGameIndex = activeGameSessions.findIndex(i=>i._id===gameId);
				if (activeGameIndex===-1 || !activeGameSessions[activeGameIndex].started) {
					return;
				}
				activeGameSessions[activeGameIndex].players.push(player);
				const activeGame = activeGameSessions[activeGameIndex];
				socket.join(gameId);
				io.to(gameId).emit("player-joined",{players: activeGame.players});
			})
		});
		
	},
	
}