#pragma once

class SurfaceRules {
public:
    class RuleSource {};
};

// TODO
class SurfaceRuleData {
public:
    static SurfaceRules::RuleSource *overworld();
    static SurfaceRules::RuleSource *overworldLike(bool p_198381_, bool haveBedrockRoof, bool haveBedrockFloor);
    static SurfaceRules::RuleSource *nether();
    static SurfaceRules::RuleSource *end();
};