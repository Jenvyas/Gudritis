import 'dotenv/config';
import type { ActiveGameSession, GameSession, Player } from "$lib/models/gameSession";
import type { StoredGameTemplate } from "$lib/models/gameTemplate";
import { Server } from "socket.io";
import type { ViteDevServer } from "vite";
import * as mongoDB from "mongodb";


/** @type {import('vite').Plugin} */
export const webSocketServer = {
	name: 'webSocketServer',
	async configureServer(server: ViteDevServer) {
		const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.DB_CONN_STRING as string);

		await client.connect();
	
		const db: mongoDB.Db = client.db(process.env.DB_NAME);

		let activeGameSessions: Array<ActiveGameSession> = [];

		const gameSessions: mongoDB.Collection<GameSession> = db.collection(process.env.GAMESESSIONS_COLLECTION_NAME as string);

		const io = new Server(server.httpServer as any)

		io.on('connection', (socket) => {
			socket.on("new-game",async ({hostId, gameId}: {hostId:string, gameId:string, gameTemplate:StoredGameTemplate, code: number})=>{
				let gameSession = await gameSessions.findOne({_id: gameId});
				if (!gameSession) {
					return;
				}
				if (gameSession.host !== hostId) {
					return;
				}
				const activeGameSession:ActiveGameSession = {
					...gameSession,
					started:false,
					finished:false,
					current_questions: new Map<string,number>()
				};
				activeGameSessions.push(activeGameSession);
				io.to(socket.id).emit("new-game-ready");
			})

			socket.on("join-game",({player, gameId}: {player: Player, gameId: string})=>{
				let activeGameIndex = activeGameSessions.findIndex(i=>i._id===gameId);
				console.log("a");
				if (activeGameIndex===-1 || !activeGameSessions[activeGameIndex].started) {
					return;
				}
				activeGameSessions[activeGameIndex].players.push(player);
				const activeGame = activeGameSessions[activeGameIndex];
				socket.join(gameId);
				socket.join(player.player_id);
				io.to(player.player_id).emit("accepted-player");
				
				io.to(gameId).emit("player-joined",{players: activeGame.players});
			})
		});
		
	},
	
}