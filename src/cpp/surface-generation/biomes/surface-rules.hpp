#pragma once

class SurfaceRules {
public:
    class RuleSource {};
};

// TODO
class SurfaceRuleData {
public:
    static SurfaceRules::RuleSource *overworld() {
        return nullptr;
    }
    static SurfaceRules::RuleSource *overworldLike(bool p_198381_, bool haveBedrockRoof, bool haveBedrockFloor) {
        return nullptr;
    }
    static SurfaceRules::RuleSource *nether() {
        return nullptr;
    }
    static SurfaceRules::RuleSource *end() {
        return nullptr;
    }
};