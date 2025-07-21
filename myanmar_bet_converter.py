# -*- coding: utf-8 -*-
"""Utility to convert Western Asian Handicap odds into Myanmar margin bets.

This module provides functions to map common Asian Handicap lines to
Myanmar-style bet types and return human readable rules and payout rates.

Example:

>>> bets = [
...     {"team": "Liverpool", "handicap": -1.5, "odds": 1.92},
...     {"team": "Chelsea", "handicap": -1.0, "odds": 2.01},
... ]
>>> convert_bets(bets)
[
    {
        'team': 'Liverpool',
        'handicap': -1.5,
        'western_odds': 1.92,
        'myanmar_type': '1-30%',
        'myanmar_rule': 'Win by 1 goal → 30% payout, win by 2+ goals → 100% payout, else lose.',
        'myanmar_payout_rate': 1.0
    },
    ...
]
"""

from typing import Dict, List

# Mapping of handicap lines to Myanmar margin bet types
HANDICAP_TO_TYPE: Dict[float, str] = {
    -1.5: "1-30%",
    -1.0: "1-50%",
    -0.5: "0.5-50%",
    0.0: "Level Ball",
    -2.0: "2-50%",
    -2.5: "2-30%",
}

# Descriptions/rules for each Myanmar bet type
MYANMAR_RULES: Dict[str, str] = {
    "1-30%": "Win by 1 goal → 30% payout, win by 2+ goals → 100% payout, else lose.",
    "1-50%": "Win by 1 goal → 50% payout, win by 2+ goals → 100% payout, else lose.",
    "0.5-50%": "Win by any → 100%, draw → 50% refund, lose → lose.",
    "Level Ball": "Win → 100%, draw → refund, lose → lose.",
    "2-50%": "Win by 2 goals → 50% payout, win by 3+ goals → 100% payout, else lose.",
    "2-30%": "Win by 2 goals → 30% payout, win by 3+ goals → 100% payout, else lose.",
}


def convert_bet(bet: Dict[str, float], commission: float = 1.0) -> Dict[str, object]:
    """Convert a single bet dictionary to Myanmar style.

    Parameters
    ----------
    bet : dict
        Dictionary with keys ``team``, ``handicap`` and ``odds``.
    commission : float, optional
        Payout rate multiplier, by default ``1.0`` (no commission).

    Returns
    -------
    dict
        Dictionary describing the Myanmar style bet.
    """
    team = bet.get("team")
    handicap = float(bet.get("handicap"))
    odds = float(bet.get("odds"))

    myanmar_type = HANDICAP_TO_TYPE.get(handicap, "Unknown")
    myanmar_rule = MYANMAR_RULES.get(
        myanmar_type, "No Myanmar rule for this handicap."
    )

    return {
        "team": team,
        "handicap": handicap,
        "western_odds": odds,
        "myanmar_type": myanmar_type,
        "myanmar_rule": myanmar_rule,
        "myanmar_payout_rate": round(commission, 2),
    }


def convert_bets(bets: List[Dict[str, float]], commission: float = 1.0) -> List[Dict[str, object]]:
    """Convert a list of bets to Myanmar style.

    Parameters
    ----------
    bets : list of dict
        Each bet dictionary should contain ``team``, ``handicap`` and ``odds``.
    commission : float, optional
        Payout rate multiplier applied to all bets.

    Returns
    -------
    list of dict
        Each dictionary contains the Myanmar mapping and rule description.
    """
    return [convert_bet(bet, commission) for bet in bets]


if __name__ == "__main__":
    # Sample usage
    sample_bets = [
        {"team": "Liverpool", "handicap": -1.5, "odds": 1.92},
        {"team": "Chelsea", "handicap": -1.0, "odds": 2.01},
        {"team": "Man United", "handicap": 0, "odds": 2.0},
        {"team": "Arsenal", "handicap": -2.5, "odds": 2.18},
    ]

    from pprint import pprint

    pprint(convert_bets(sample_bets))
