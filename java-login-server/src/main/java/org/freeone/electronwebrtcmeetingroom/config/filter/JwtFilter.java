package org.freeone.electronwebrtcmeetingroom.config.filter;

import org.apache.commons.lang3.StringUtils;
import org.freeone.electronwebrtcmeetingroom.util.JWTUtil;
import org.springframework.util.AntPathMatcher;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * @author zhongxia03
 */
public class JwtFilter implements Filter {
    /**
     * 需要认证的
     */

    List<String> ignorePath = Arrays.asList(
            "/login.htm"
            ,"/login.json"
            ,"/open/**"
            ,"/images/**"
            ,"/**/*.css"
            , "/**/*.js"
            , "/**/*.woff"
            , "/dev/**"
            , "/imserver/**"
            , "/api/**");

    AntPathMatcher antPathMatcher = new AntPathMatcher();

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String requestURI = request.getServletPath();
        for (String s : ignorePath) {
            if (antPathMatcher.match(s, requestURI)) {
                filterChain.doFilter(request, servletResponse);
                return;
            }
        }
        String token = request.getHeader("token");
        if (StringUtils.isBlank(token)){
            throw new RuntimeException("获取不到token");
        }
        String userId = JWTUtil.getUserId(token);
        if (StringUtils.isBlank(userId)){
            throw new RuntimeException("token验证失败");
        }
        request.setAttribute("userId",userId);
        filterChain.doFilter(request, servletResponse);
    }
}
