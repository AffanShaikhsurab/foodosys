'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface LeaderboardEntry {
    user_id: string
    total_karma: number
    weekly_karma: number
    monthly_karma: number
    rank_position: number
    user_profiles: {
        display_name: string
        avatar_url: string | null
        level: number
    }
}

interface LeaderboardProps {
    isOpen: boolean
    onClose: () => void
}

export default function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
    const { user, isLoaded } = useUser()
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'all' | 'weekly' | 'monthly'>('all')

    useEffect(() => {
        if (isOpen) {
            fetchLeaderboard()
        }
    }, [isOpen, activeTab])

    const fetchLeaderboard = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/leaderboard?type=${activeTab}&limit=50`)
            const data = await response.json()

            if (data.error) {
                setError(data.error)
            } else {
                setLeaderboard(data.leaderboard || [])
                setUserEntry(data.userEntry || null)
            }
        } catch (err) {
            setError('Failed to load leaderboard')
            console.error('Leaderboard fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    const getRankIcon = (rank: number) => {
        if (rank === 1) return '🥇'
        if (rank === 2) return '🥈'
        if (rank === 3) return '🥉'
        return `#${rank}`
    }

    const getRankClass = (rank: number) => {
        if (rank === 1) return 'rank-gold'
        if (rank === 2) return 'rank-silver'
        if (rank === 3) return 'rank-bronze'
        return ''
    }

    const getLevelBadge = (level: number) => {
        const badges = ['🌱', '🌿', '🌳', '⭐', '🏆']
        return badges[Math.min(level - 1, badges.length - 1)]
    }

    const getKarmaDisplay = (entry: LeaderboardEntry) => {
        switch (activeTab) {
            case 'weekly':
                return entry.weekly_karma
            case 'monthly':
                return entry.monthly_karma
            default:
                return entry.total_karma
        }
    }

    if (!isOpen) return null

    return (
        <div className="leaderboard-overlay" onClick={onClose}>
            <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
                <div className="leaderboard-header">
                    <div className="leaderboard-title">
                        <i className="ri-trophy-fill"></i>
                        <h2>Leaderboard</h2>
                    </div>
                    <button className="leaderboard-close" onClick={onClose}>
                        <i className="ri-close-line"></i>
                    </button>
                </div>

                <div className="leaderboard-tabs">
                    <button
                        className={`leaderboard-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Time
                    </button>
                    <button
                        className={`leaderboard-tab ${activeTab === 'weekly' ? 'active' : ''}`}
                        onClick={() => setActiveTab('weekly')}
                    >
                        This Week
                    </button>
                    <button
                        className={`leaderboard-tab ${activeTab === 'monthly' ? 'active' : ''}`}
                        onClick={() => setActiveTab('monthly')}
                    >
                        This Month
                    </button>
                </div>

                <div className="leaderboard-content">
                    {loading ? (
                        <div className="leaderboard-loading">
                            <i className="ri-loader-4-line animate-spin"></i>
                            <span>Loading leaderboard...</span>
                        </div>
                    ) : error ? (
                        <div className="leaderboard-error">
                            <i className="ri-error-warning-line"></i>
                            <span>{error}</span>
                            <button onClick={fetchLeaderboard}>Retry</button>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="leaderboard-empty">
                            <i className="ri-trophy-line"></i>
                            <span>No contributors yet. Be the first!</span>
                        </div>
                    ) : (
                        <>
                            {/* Top 3 Podium */}
                            <div className="leaderboard-podium">
                                {leaderboard.slice(0, 3).map((entry, index) => (
                                    <div
                                        key={entry.user_id}
                                        className={`podium-item podium-${index + 1}`}
                                    >
                                        <div className="podium-avatar">
                                            {entry.user_profiles?.avatar_url ? (
                                                <img
                                                    src={entry.user_profiles.avatar_url}
                                                    alt={entry.user_profiles?.display_name || 'User'}
                                                />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    <i className="ri-user-smile-line"></i>
                                                </div>
                                            )}
                                            <span className="podium-rank">{getRankIcon(index + 1)}</span>
                                        </div>
                                        <div className="podium-name">
                                            {entry.user_profiles?.display_name || 'Anonymous'}
                                        </div>
                                        <div className="podium-karma">
                                            {getKarmaDisplay(entry).toLocaleString()} pts
                                        </div>
                                        <div className="podium-level">
                                            {getLevelBadge(entry.user_profiles?.level || 1)} Lvl {entry.user_profiles?.level || 1}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Rest of Leaderboard */}
                            <div className="leaderboard-list">
                                {leaderboard.slice(3).map((entry) => (
                                    <div
                                        key={entry.user_id}
                                        className={`leaderboard-item ${userEntry && userEntry.user_id === entry.user_id ? 'current-user' : ''
                                            }`}
                                    >
                                        <div className="leaderboard-rank">
                                            {getRankIcon(entry.rank_position)}
                                        </div>
                                        <div className="leaderboard-avatar">
                                            {entry.user_profiles?.avatar_url ? (
                                                <img
                                                    src={entry.user_profiles.avatar_url}
                                                    alt={entry.user_profiles?.display_name || 'User'}
                                                />
                                            ) : (
                                                <div className="avatar-placeholder-small">
                                                    <i className="ri-user-smile-line"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="leaderboard-info">
                                            <div className="leaderboard-name">
                                                {entry.user_profiles?.display_name || 'Anonymous'}
                                                {userEntry && userEntry.user_id === entry.user_id && (
                                                    <span className="you-badge">You</span>
                                                )}
                                            </div>
                                            <div className="leaderboard-level">
                                                {getLevelBadge(entry.user_profiles?.level || 1)} Level {entry.user_profiles?.level || 1}
                                            </div>
                                        </div>
                                        <div className="leaderboard-karma">
                                            <span className="karma-value">{getKarmaDisplay(entry).toLocaleString()}</span>
                                            <span className="karma-label">pts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Current User Position (if not in top 50) */}
                            {userEntry && !leaderboard.find(e => e.user_id === userEntry.user_id) && (
                                <div className="leaderboard-user-position">
                                    <div className="divider">
                                        <span>Your Position</span>
                                    </div>
                                    <div className="leaderboard-item current-user">
                                        <div className="leaderboard-rank">
                                            #{userEntry.rank_position || '—'}
                                        </div>
                                        <div className="leaderboard-avatar">
                                            {userEntry.user_profiles?.avatar_url ? (
                                                <img
                                                    src={userEntry.user_profiles.avatar_url}
                                                    alt={userEntry.user_profiles?.display_name || 'User'}
                                                />
                                            ) : (
                                                <div className="avatar-placeholder-small">
                                                    <i className="ri-user-smile-line"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="leaderboard-info">
                                            <div className="leaderboard-name">
                                                {userEntry.user_profiles?.display_name || 'Anonymous'}
                                                <span className="you-badge">You</span>
                                            </div>
                                            <div className="leaderboard-level">
                                                {getLevelBadge(userEntry.user_profiles?.level || 1)} Level {userEntry.user_profiles?.level || 1}
                                            </div>
                                        </div>
                                        <div className="leaderboard-karma">
                                            <span className="karma-value">{getKarmaDisplay(userEntry).toLocaleString()}</span>
                                            <span className="karma-label">pts</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="leaderboard-footer">
                    <div className="karma-info">
                        <i className="ri-information-line"></i>
                        <span>Earn karma by uploading menu photos</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Trophy Button Component for use in Header - Uses new leaderboard-pill style
export function LeaderboardButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <div
                className="leaderboard-pill click-active"
                onClick={() => setIsOpen(true)}
                title="View Leaderboard"
            >
                <i className="ri-trophy-line"></i>
                <span>Leaderboard</span>
            </div>
            <Leaderboard isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}
