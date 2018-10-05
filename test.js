const bluebird = require('bluebird')
const redis = require('redis');
global.Promise = bluebird

Promise.promisifyAll(redis.RedisClient.prototype)
const client = redis.createClient();

// KEY 형식
// 성별:나이:지역코드:uid

// 여자 + 20 + 120(서울 동작구 코드)
// sscan user-set 0 match f:20:120:* count 10

// 매칭되는 10개를 가져와서 서버에서 랜덤으로 1개를 선택함

// 여자 + 10대 + 120(서울 동작구 코드)
// 나이의 범위일 경우를 사용할 경우 나이 코드 추가된
// 10대:1
// 20대:2
// ...

// 그러면 키값은 
// 성별:나이범위:지역코드:나이:uid

// 명령어
// sscan user-set 0 match f:1:120:* count 10

const list = [
    'f:20:100:a001',
    'm:20:200:a002',
    'f:30:100:a003',
    'm:40:200:a004',
    'f:20:100:a005',
    'm:10:200:a006',
    'm:10:200:a007',
    'f:10:200:a008',
    'f:10:100:a009',
    'f:10:100:a010',
    'f:10:100:a011',
    'f:10:100:a012',
    'f:10:100:a013',
    'f:10:100:a014',
    'f:10:100:a015',
    'f:10:100:a016',  
    'f:10:100:a017',
    'f:10:100:a018',
    'f:10:100:a019',
    'f:10:100:a020',
]

const test = async () => {
    try {
        const mySet = await client.smembersAsync('my-set')
        await client.delAsync('my-set', mySet);
        await client.saddAsync('my-set', list);
        await client.smembersAsync('my-set');
        const sscan1 = await client.sscanAsync('my-set', 0, 'MATCH', 'f:10:100:*', 'COUNT', 10);
        const sscan2 = await client.sscanAsync('my-set', sscan1[0], 'MATCH', 'f:10:100:*', 'COUNT', 10);
        console.log(sscan1)
        console.log(sscan2)
    } catch (e) {
        console.error(e)
    }
}
test()