import { readUsers, getRandomProxy } from "./utils/helper.js";
import log from "./utils/logger.js";
import bedduSalama from "./utils/banner.js";
import {
    fetchAllAchievements,
    fetchUserInfo,
    fetchMissionList,
    fetchPetList,
    claimMission,
    joinMission,
    getNewPet,
    fetchPetDnaList,
    indehoy,
    checkIn,
    fetchQuestList,
    joinClan,
    claimAchievement,
    fetchSeasonPass,
    claimSeasonPass,
    fetchGatchaBonus,
    claimGatchaBonus,

} from "./utils/scripts.js";

function getUsedPetIds(missions) {
    const usedPetIds = [];
    for (const mission of missions) {
        if (mission.pet_joined) {
            mission.pet_joined.forEach(pet => usedPetIds.push(pet.pet_id));
        }
    }
    return [...usedPetIds];
}

function getAvailablePetIds(allPetIds, usedPetIds) {
    const usedPetIdsCount = usedPetIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {});

    const availablePetIds = [];

    for (const petId of allPetIds) {
        if (usedPetIdsCount[petId] > 0) {
            usedPetIdsCount[petId]--;
        } else {
            availablePetIds.push(petId);
        }
    }

    return availablePetIds;
}

function checkFirstMatchingMission(missions, availablePetIds, usedPetIds, petIdsByStarAndClass) {
    for (let i = missions.length - 1; i >= 0; i--) {
        const mission = missions[i];
        if (mission.pet_joined) {
            continue;
        }
        const getPetIdsByClassAndMinStar = (classType, minStar) => {
            return Object.entries(petIdsByStarAndClass)
                .filter(([star]) => parseInt(star, 10) >= minStar)
                .flatMap(([_, classMap]) => classMap[classType] || []);
        };

        const petIds = { pet_1_id: null, pet_2_id: null, pet_3_id: null };
        const assignedPetIds = new Set();

        const assignPet = (petClass, petStar, petKey) => {
            const petMatches = getPetIdsByClassAndMinStar(petClass, petStar);
            const availablePet = petMatches.find(pet => availablePetIds.includes(pet) && !assignedPetIds.has(pet));

            if (availablePet) {
                petIds[petKey] = availablePet;
                usedPetIds.push(availablePet);
                assignedPetIds.add(availablePet);
            }
        };

        assignPet(mission.pet_1_class, mission.pet_1_star, "pet_1_id");
        assignPet(mission.pet_2_class, mission.pet_2_star, "pet_2_id");
        assignPet(mission.pet_3_class, mission.pet_3_star, "pet_3_id");

        if (petIds.pet_1_id && petIds.pet_2_id && petIds.pet_3_id) {
            const matchingMission = { mission_id: mission.mission_id, ...petIds };
            return matchingMission;
        }
    }

    return null;
}

const getPower = async (headers, proxy) => {
    const userInfo = (await fetchUserInfo(headers, proxy))?.result;
    const name = userInfo?.telegram_username || "Unknown";
    const token = userInfo?.token || 0;
    const power = userInfo?.god_power || 0;
        log.debug(`用户信息:`, JSON.stringify({ name, token, power }));

    return power;
}
const mergePetIds = async (headers, proxy) => {
    const petIds = await fetchPetDnaList(headers, proxy);
    if (!petIds.allPetIds || petIds.allPetIds.length < 1) {
        return;
    };
    log.info("可用雌性宠物数量:", petIds?.momPetIds?.length || 0);
    log.info("可用雄性宠物数量:", petIds?.dadPetIds?.length || 0);

    if (petIds.momPetIds.length < 1) {
        log.warn("没有可用的雌性宠物进行配对 😢💔");
        return;
    }

    const moms = [...petIds.momPetIds];
    const dads = [...petIds.dadPetIds];

    while (moms.length > 0) {
        const momIndex = Math.floor(Math.random() * moms.length);
        const dadIndex = Math.floor(Math.random() * dads.length);

        const mom = moms[momIndex];
        const dad = dads[dadIndex];

        if (mom !== undefined && dad !== undefined) {
            log.info(`正在配对宠物 ${mom} 和 ${dad}💕`);
            await indehoy(headers, proxy, mom, dad);

            moms.splice(momIndex, 1);
            dads.splice(dadIndex, 1);
            await delay(1);
        } else if (moms.length > 1 && momIndex + 1 < moms.length) {
            const nextMom = moms[momIndex + 1];

            if (mom !== nextMom) {
                log.info(`正在配对宠物 ${mom} 和 ${nextMom}💕`);
                await indehoy(headers, proxy, mom, nextMom);

                moms.splice(momIndex, 1);
                moms.splice(momIndex, 1);
                await delay(1);
            };
        } else {
            log.warn("没有可配对的宠物 😢💔");
            break;
        }
    }
};

const doMissions = async (headers, proxy) => {
    const petData = await fetchPetList(headers, proxy);
    const { petIdsByStarAndClass, allPetIds } = petData;
    const missionLists = await fetchMissionList(headers, proxy);
    const usedPetIds = getUsedPetIds(missionLists);
    const availablePetIds = getAvailablePetIds(allPetIds, usedPetIds);
    log.info("可用宠物数量:", availablePetIds.length);

    const firstMatchingMission = checkFirstMatchingMission(missionLists, availablePetIds, usedPetIds, petIdsByStarAndClass);
    if (firstMatchingMission) {
        log.info("使用可用宠物进入任务:", JSON.stringify(firstMatchingMission));
        await joinMission(headers, proxy, firstMatchingMission);
        await doMissions(headers, proxy);
    } else {
        log.warn("当前可用宠物无法加入更多任务");
    }
}

const doDailyQuests = async (headers, proxy, dailyQuests) => {
    for (const quest of dailyQuests) {
        log.info("正在执行每日任务:", quest);
        await checkIn(headers, proxy, quest);
    }
}
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms * 1000));

const getSeasonPass = async (headers, proxy) => {
    const seasonPasss = await fetchSeasonPass(headers, proxy);

    if (seasonPasss) {
        for (const seasonPass of seasonPasss) {
            const { season_id: seasonPassId = 0, current_step: currentStep = 0, title = "Unknown", free_rewards: freePassRewards = [] } = seasonPass;

            log.info(`检查赛季通行证 ID: ${seasonPassId}, 当前进度: ${currentStep}, 描述: ${title}`);

            for (const reward of freePassRewards) {
                const { step, is_claimed: isClaimed, amount, name } = reward;

                if (step > currentStep || isClaimed) {
                    continue;
                }

                log.info(`领取赛季通行证 ID: ${seasonPassId} 的奖励, 进度: ${step}, 奖励: ${amount} ${name}`);
                await claimSeasonPass(headers, proxy, seasonPassId, 'free', step);
            }
        }
    } else {
        log.warn("未找到赛季通行证");
    }
}

const checkUserReward = async (headers, proxy) => {
    log.info("正在检查可用任务...");
    try {
        const questIds = await fetchQuestList(headers, proxy);
        if (questIds.length > 1) {
            log.info("找到任务 ID:", questIds);
            await joinClan(headers, proxy);
            await doDailyQuests(headers, proxy, questIds);
            await delay(2);
        } else {
            log.warn("没有可执行的任务");
        }
        log.info("正在检查已完成的成就...");
        await delay(1);
        const achievements = await fetchAllAchievements(headers, proxy);
        if (achievements.length > 0) {
            log.info("找到已完成的成就:", achievements.length);
            await delay(1);
            for (const achievement of achievements) {
                log.info("正在领取成就 ID:", achievement);
                await claimAchievement(headers, proxy, achievement);
                await delay(1);
            }
        } else {
            log.warn("未找到已完成的成就");
        }
        log.info("正在检查可用的赛季通行证...");
        await getSeasonPass(headers, proxy);
        await delay(1);
    } catch (error) {
        log.error("检查用户奖励时出错:", error);
    }
};

async function startMission() {
    const users = readUsers("users.txt");

    let userCount = 1;
    for (const user of users) {
        const proxy = getRandomProxy();
        console.log(`\n`)
        log.info(` === 正在为用户 #${userCount} 执行任务，使用代理: ${proxy} ===`);
        const headers = {
            "Content-Type": "application/json",
            "tg-init-data": user,
        };

        log.info("正在获取扭蛋奖励...");
        const gatchaBonus = await fetchGatchaBonus(headers, proxy);
        const { current_step, is_claimed_god_power, is_claimed_dna, step_bonus_god_power, step_bonus_dna } = gatchaBonus;
        if (current_step >= step_bonus_god_power && !is_claimed_god_power) {
            log.info("正在领取神力奖励...");
            await claimGatchaBonus(headers, proxy, 1);
        } else if (current_step >= step_bonus_dna && !is_claimed_dna) {
            log.info("正在领取DNA奖励...");
            await claimGatchaBonus(headers, proxy, 2);
        } else {
            log.warn("没有可领取的扭蛋奖励");
        };

        let power = await getPower(headers, proxy);
        while (power >= 1) {
            log.info("神力足够抽取新宠物，开始吧！");
            power = await getNewPet(headers, proxy);
            await delay(1);
        };

        log.info("正在寻找可以配对的宠物父母！❤️");
        await mergePetIds(headers, proxy);
        await delay(1);
        try {
            const missionLists = await fetchMissionList(headers, proxy);

            log.info("正在检查已完成的任务...");
            await delay(1);
            const missionIds = missionLists.filter(mission => mission.can_completed).map(mission => mission.mission_id);
            if (missionIds.length > 0) {
                for (const missionId of missionIds) {
                    log.info("正在领取任务 ID:", missionId);
                    await claimMission(headers, proxy, missionId);
                    await delay(1);
                }
            } else {
                log.warn("未找到已完成的任务");
            };
            log.info("正在检查可进入的任务...");
            await doMissions(headers, proxy)
            await delay(1);
            await checkUserReward(headers, proxy);
        } catch (error) {
            log.error("获取任务数据时出错:", error);
        }
        userCount++;
    }
}

async function main() {
    log.debug(bedduSalama);
    await delay(1);
    while (true) {
        await startMission();
        log.warn("等待30分钟后继续...");
        await delay(30 * 60);
    }
}

main();
