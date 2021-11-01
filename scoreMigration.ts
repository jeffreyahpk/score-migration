import {
    connect, 
    ContestModel, 
    Participant,
    ParticipantModel,
    Contest,
    Game,
} from '@phantasia/models';
import moment from 'moment';
import {model, Schema, Types} from 'mongoose';

interface ParticipantGamePerformance {
    participant: Types.ObjectId | Participant;
    contest: Types.ObjectId | Contest;
    game: Types.ObjectId | Game;
    score_for_offense: number;
    score_for_defense: number;
}

const ParticipantGamePerformanceSchema =
    new Schema<ParticipantGamePerformance>({
        participant: {
            type: Schema.Types.ObjectId,
            ref: 'participant',
        },
        contest: {
            type: Schema.Types.ObjectId,
            ref: 'contest',
        },
        game: {
            type: Schema.Types.ObjectId,
            ref: 'game',
        },
        score_for_offense: {
            type: Number,
        },
        score_for_defense: {
            type: Number,
        },
    }).index({ participant: 1, contest: 1, game: 1 }, { unique: true });

const ParticipantGamePerformanceModel =
    model<ParticipantGamePerformance>(
        'participant_game_performance',
        ParticipantGamePerformanceSchema
    );

connect('mongodb://localhost:27017/production').then(async () => {
    await writeScores();
    process.exit(0);
});

async function writeScores() {
    const participants = await ParticipantModel.find({});

    for(const participant of participants) {
        const contestId = participant.contest;
    
        const contest = await ContestModel.findById(contestId);
    
        const participantGamePerformances = await  ParticipantGamePerformanceModel.find({
            participant: participant._id,
            contest: contestId
        });
    
        let total = 0;
        for(const gameScore of participantGamePerformances) {
            const defense = gameScore.score_for_defense;
            const offense = gameScore.score_for_offense;
            total += defense + offense;
        }

        participant.score = total;

        if (!participant.last_updated) {
            participant.last_updated = contest?.start_date ? contest.start_date : moment.utc().toDate();
        }

        participant.save();
    }
}