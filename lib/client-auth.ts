// 客户端认证工具函数
export async function logout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    })
    
    if (response.ok) {
      window.location.href = "/login"
    }
  } catch (error) {
    console.error("Logout failed:", error)
  }
} 