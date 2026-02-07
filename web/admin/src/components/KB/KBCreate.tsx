import { KnowledgeBaseFormData } from '@/api';
import {
  getApiV1KnowledgeBaseList,
  postApiV1KnowledgeBase,
} from '@/request/KnowledgeBase';
import { DomainCreateKnowledgeBaseReq } from '@/request/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { setKbC, setKbId, setKbList } from '@/store/slices/config';
import { CheckCircle } from '@mui/icons-material';
import { Box, Checkbox, Divider, Stack, TextField } from '@mui/material';
import { message, Modal } from '@ctzhian/ui';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import Card from '../Card';
import FileText from '../UploadFile/FileText';

// 验证规则常量
const VALIDATION_RULES = {
  name: {
    required: {
      value: true,
      message: 'Wiki 站名称不能为空',
    },
  },
  port: {
    required: {
      value: true,
      message: '端口不能为空',
    },
    min: {
      value: 1,
      message: '端口号不能小于1',
    },
    max: {
      value: 65535,
      message: '端口号不能大于65535',
    },
  },
  domain: {
    pattern: {
      value:
        /^(localhost|((([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)\.)+[a-zA-Z]{2,})|(\d{1,3}(?:\.\d{1,3}){3})|(\[[0-9a-fA-F:]+\]))$/,
      message: '请输入有效的域名、IP 或 localhost',
    },
  },
};

const KBCreate = () => {
  const dispatch = useAppDispatch();
  const { kb_c, kbList, modelStatus } = useAppSelector(state => state.config);

  const location = useLocation();
  const { pathname } = location;

  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<KnowledgeBaseFormData>({
    defaultValues: {
      name: '',
      domain: window.location.hostname,
      http: true,
      port: 80,
      ssl_port: 443,
      https: false,
      httpsCert: '',
      httpsKey: '',
    },
  });

  const { http, https, port, ssl_port, domain, name } = watch();

  const onSubmit = (value: KnowledgeBaseFormData) => {
    const formData: DomainCreateKnowledgeBaseReq = { name: value.name };
    if (value.domain) formData.hosts = [value.domain];
    if (value.http) formData.ports = [+value.port];
    if (value.https) {
      formData.ssl_ports = [+value.ssl_port];
      if (value.httpsCert) formData.public_key = value.httpsCert;
      else {
        message.error('请上传 SSL 证书文件');
        return;
      }
      if (value.httpsKey) formData.private_key = value.httpsKey;
      else {
        message.error('请上传 SSL 私钥文件');
        return;
      }
    }
    postApiV1KnowledgeBase(formData)
      // @ts-expect-error 类型错误
      .then(({ id }) => {
        message.success('创建成功');
        setOpen(false);
        setSuccess(true);
        getKbList(id);
        dispatch(setKbC(false));
      })
      .catch(error => {
        console.error('💥 创建知识库失败:', error);
        message.error(error?.message || '创建知识库失败');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getKbList = (id?: string) => {
    const kb_id = id || localStorage.getItem('kb_id') || '';
    getApiV1KnowledgeBaseList().then(res => {
      dispatch(setKbList(res));
      if (res.find(item => item.id === kb_id)) {
        dispatch(setKbId(kb_id));
      } else {
        dispatch(setKbId(res[0]?.id || ''));
      }
    });
  };

  useEffect(() => {
    setOpen(kb_c);
  }, [kb_c]);

  useEffect(() => {
    if (kbList && kbList.length === 0 && modelStatus) setOpen(true);
  }, [kbList, modelStatus]);

  useEffect(() => {
    dispatch(setKbC(false));
  }, [pathname, modelStatus]);

  return (
    <>
      <Modal
        title={
          <Stack direction='row' alignItems='center' gap={1}>
            <CheckCircle sx={{ color: 'success.main' }} />
            {name} 创建成功
          </Stack>
        }
        open={success}
        showCancel={false}
        okText='关闭'
        onCancel={() => {
          setSuccess(false);
          setTimeout(() => {
            reset();
          }, 1000);
        }}
        onOk={() => {
          setSuccess(false);
          setTimeout(() => {
            reset();
          }, 1000);
        }}
        closable={false}
        cancelText='关闭'
      >
        <Card sx={{ p: 2, fontSize: 14, bgcolor: 'background.paper3' }}>
          <Box sx={{ color: 'text.tertiary', mb: 1 }}>
            打开以下地址访问门户网站
          </Box>
          {http && (
            <Box>
              <Box
                component={'a'}
                href={
                  port === 80 ? `http://${domain}` : `http://${domain}:${port}`
                }
                target='_blank'
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {port === 80 ? `http://${domain}` : `http://${domain}:${port}`}
              </Box>
            </Box>
          )}
          {https && (
            <Box>
              <Box
                component={'a'}
                href={
                  ssl_port === 443
                    ? `https://${domain}`
                    : `https://${domain}:${ssl_port}`
                }
                target='_blank'
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {ssl_port === 443
                  ? `https://${domain}`
                  : `https://${domain}:${ssl_port}`}
              </Box>
            </Box>
          )}
        </Card>
      </Modal>
      <Modal
        open={open}
        onCancel={() => {
          reset();
          dispatch(setKbC(false));
          setOpen(false);
        }}
        okText={'创建'}
        onOk={handleSubmit(onSubmit)}
        disableEscapeKeyDown={(kbList || []).length === 0}
        title='创建 Wiki 站'
        closable={(kbList || []).length > 0}
        showCancel={(kbList || []).length > 0}
        okButtonProps={{ loading, disabled: !(http || https) }}
      >
        <Box sx={{ mt: 1 }}>
          <Controller
            control={control}
            name='name'
            rules={VALIDATION_RULES.name}
            render={({ field }) => (
              <TextField
                {...field}
                label={
                  <Box>
                    知识库名称
                    <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>
                      *
                    </Box>
                  </Box>
                }
                autoFocus
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
        </Box>
        <Divider
          textAlign='left'
          sx={{
            my: 2,
            fontSize: 14,
            lineHeight: '32px',
            color: 'text.tertiary',
          }}
        >
          服务监听方式
        </Divider>
        <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mt: 2.5 }}>
          <Box
            component={'label'}
            sx={{ width: 136, flexShrink: 0, cursor: 'pointer', fontSize: 14 }}
          >
            域名或 IP
          </Box>
          <Controller
            control={control}
            name='domain'
            rules={VALIDATION_RULES.domain}
            render={({ field }) => (
              <TextField
                {...field}
                label='域名'
                fullWidth
                error={!!errors.domain}
                helperText={errors.domain?.message}
              />
            )}
          />
        </Stack>
        <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mt: 2.5 }}>
          <Controller
            control={control}
            name='http'
            render={({ field }) => (
              <Checkbox
                {...field}
                id='http'
                checked={http}
                size='small'
                sx={{ p: 0 }}
              />
            )}
          />
          <Box
            component={'label'}
            htmlFor='http'
            sx={{
              width: 100,
              flexShrink: 0,
              cursor: 'pointer',
              fontSize: 14,
              color: http ? 'text.primary' : 'text.tertiary',
            }}
          >
            启用 HTTP
          </Box>
          {
            <Controller
              control={control}
              name='port'
              rules={VALIDATION_RULES.port}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='端口'
                  fullWidth
                  disabled={!http}
                  type='number'
                  value={http ? +field.value || 80 : ''}
                  error={!!errors.port}
                  helperText={errors.port?.message}
                />
              )}
            />
          }
        </Stack>
        <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mt: 1.5 }}>
          <Controller
            control={control}
            name='https'
            render={({ field }) => (
              <Checkbox
                {...field}
                id='https'
                checked={https}
                size='small'
                sx={{ p: 0 }}
              />
            )}
          />
          <Box
            component={'label'}
            htmlFor='https'
            sx={{
              width: 100,
              flexShrink: 0,
              cursor: 'pointer',
              fontSize: 14,
              color: https ? 'text.primary' : 'text.tertiary',
            }}
          >
            启用 HTTPS
          </Box>
          {
            <Controller
              control={control}
              name='ssl_port'
              rules={VALIDATION_RULES.port}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='端口'
                  fullWidth
                  disabled={!https}
                  type='number'
                  value={https ? +field.value || 443 : ''}
                  error={!!errors.ssl_port}
                  helperText={errors.ssl_port?.message}
                />
              )}
            />
          }
        </Stack>
        {https && (
          <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mt: 2 }}>
            <Controller
              control={control}
              name='httpsCert'
              render={({ field }) => <FileText {...field} tip={'证书文件'} />}
            />
            <Controller
              control={control}
              name='httpsKey'
              render={({ field }) => <FileText {...field} tip={'私钥文件'} />}
            />
          </Stack>
        )}
      </Modal>
    </>
  );
};

export default KBCreate;
