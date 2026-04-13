export interface XTweet {
  id: string
  text: string
  created_at: string
  author: {
    name: string
    username: string
    profile_image_url: string
    verified: boolean
  }
  metrics: {
    like_count: number
    retweet_count: number
    reply_count: number
  }
}
