import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'

/**
 * 全局HTTP异常过滤器
 * 统一处理所有HTTP异常并返回中文错误消息
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    // 提取错误消息
    let message: string | string[]
    let validationErrors: string[] | undefined
    
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse
    } else if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      message = (exceptionResponse as any).message
    } else {
      message = '请求失败'
    }

    // 如果消息是数组（验证错误），保留完整的错误信息用于调试
    if (Array.isArray(message)) {
      validationErrors = message
      // 记录完整的验证错误到日志
      console.error('[Validation Error]', JSON.stringify(validationErrors, null, 2))
      message = message[0]
    }

    // 转换常见英文错误为中文（如果后端返回了英文错误）
    message = this.translateErrorMessage(message, status)

    // 返回统一的错误响应格式
    const errorResponse: any = {
      statusCode: status,
      message: message,
      error: this.getErrorName(status),
      timestamp: new Date().toISOString(),
    }
    
    // 在开发环境或验证错误时，返回详细的错误信息
    if (validationErrors && (process.env.NODE_ENV !== 'production' || status === 400)) {
      errorResponse.validationErrors = validationErrors
    }
    
    response.status(status).json(errorResponse)
  }

  /**
   * 翻译常见的英文错误消息为中文
   */
  private translateErrorMessage(message: string, status: number): string {
    // 如果message不是字符串（可能是对象），转换为字符串
    if (typeof message !== 'string') {
      message = JSON.stringify(message)
    }
    
    // 如果已经是中文，直接返回
    if (/[\u4e00-\u9fa5]/.test(message)) {
      return message
    }

    // 根据常见的错误模式进行翻译
    const errorMap: { [key: string]: string } = {
      'Unauthorized': '未授权，请登录',
      'Forbidden': '没有权限访问该资源',
      'Not Found': '请求的资源不存在',
      'Bad Request': '请求参数错误',
      'Conflict': '数据冲突',
      'Internal Server Error': '服务器内部错误',
      'Service Unavailable': '服务暂时不可用',
      'Gateway Timeout': '网关超时',
      'Token expired': 'Token已过期，请重新登录',
      'Invalid token': 'Token无效，请重新登录',
      'User not found': '用户不存在',
      'Invalid credentials': '邮箱或密码错误',
      'Email already exists': '该邮箱已被注册',
      'Validation failed': '数据验证失败',
    }

    // 尝试匹配错误消息
    for (const [english, chinese] of Object.entries(errorMap)) {
      if (message.toLowerCase().includes(english.toLowerCase())) {
        return chinese
      }
    }

    // 根据状态码返回默认消息
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return '请求参数错误'
      case HttpStatus.UNAUTHORIZED:
        return '登录已过期，请重新登录'
      case HttpStatus.FORBIDDEN:
        return '没有权限执行此操作'
      case HttpStatus.NOT_FOUND:
        return '请求的资源不存在'
      case HttpStatus.CONFLICT:
        return '数据冲突，请刷新后重试'
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return '数据验证失败'
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return '服务器内部错误，请稍后重试'
      case HttpStatus.BAD_GATEWAY:
      case HttpStatus.SERVICE_UNAVAILABLE:
      case HttpStatus.GATEWAY_TIMEOUT:
        return '服务暂时不可用，请稍后重试'
      default:
        return message || '请求失败'
    }
  }

  /**
   * 获取错误名称
   */
  private getErrorName(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request'
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized'
      case HttpStatus.FORBIDDEN:
        return 'Forbidden'
      case HttpStatus.NOT_FOUND:
        return 'Not Found'
      case HttpStatus.CONFLICT:
        return 'Conflict'
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity'
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error'
      default:
        return 'Error'
    }
  }
}

