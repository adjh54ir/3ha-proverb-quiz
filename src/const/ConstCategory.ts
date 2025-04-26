import { MainDataType } from "@/types/MainDataType";

const CONST_CATEGORY = {

    CATEGORIES:
        [
            { name: "상의", icon: "shirt" },
            { name: "하의", icon: "person-pants" },
            { name: "외투", icon: "vest" },
            { name: "신발", icon: "shoe-prints" },
            { name: "모자", icon: "hat-cowboy" },
            { name: "속옷(상의)", icon: "vest-patches" },
            { name: "속옷(하의)", icon: "underwear" },
            { name: "가방", icon: "bag", iconType: "material" },
            { name: "안경/선글라스", icon: "glasses" },
            { name: "양말", icon: "socks" },
            { name: "악세서리", icon: "ring", iconType: "material" },
        ],
    CATEGORIES_DATAIL: {
        모자: ["선택 안함", "캡모자", "버킷햇(벙거지)", "비니", "기타"],
        "안경/선글라스": ["선택 안함", "안경", "선글라스", "기타"],
        상의: ["선택 안함", "반팔", "긴팔", "셔츠", "니트", "민소매", "기타"],
        하의: [
            "선택 안함",
            "청바지",
            "슬랙스",
            "면바지",
            "치마",
            "반바지",
            "트레이닝 바지",
            "기타",
        ],
        외투: ["선택 안함", "자켓", "코트", "패딩", "기타"],
        신발: ["선택 안함", "운동화", "구두", "샌들", "슬리퍼", "부츠", "기타"],
        "속옷(상의)": [
            "선택 안함",
            "런닝",
            "민소매",
            "브라",
            "브라렛",
            "캐미솔",
            "기타",
        ],
        "속옷(하의)": [
            "선택 안함",
            "팬티",
            "트렁크스",
            "사각팬티",
            "삼각팬티",
            "기타",
        ],
        양말: ["선택 안함", "발목", "중목", "장목", "기타"],
        악세서리: ["선택 안함", "시계", "목걸이", "귀걸이", "스카프/목도리", "장갑", "기타"],
        가방: ["선택 안함", "백팩", "숄더백", "크로스백", "토트백", "클러치", "기타"],
    }


}

export default CONST_CATEGORY;